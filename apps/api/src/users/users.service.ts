import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Provider } from '../../prisma/generated/prisma/client';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params ?? {};
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const provider = await this.prisma.authProvider.findUnique({
      where: { userId_provider: { userId, provider: Provider.local } },
    });

    if (!provider?.password) {
      throw new BadRequestException(
        'Aucun mot de passe local configuré pour ce compte.',
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, provider.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.authProvider.update({
      where: { userId_provider: { userId, provider: Provider.local } },
      data: { password: hashed },
    });

    // Invalidate all refresh tokens → forces re-login on all devices
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { success: true };
  }
}
