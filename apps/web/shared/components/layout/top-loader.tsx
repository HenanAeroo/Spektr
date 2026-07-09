const TopLoader = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div
      id="rail"
      className={`fixed top-0 left-0 w-screen h-0.5 z-9999 overflow-hidden pointer-events-none transition-opacity duration-300 ${isLoading ? "opacity-100" : "opacity-0"}`}
    >
      <div
        id="sheen"
        className="absolute top-0 left-0 w-[40%] h-full bg-spektr-teal shimmer"
      ></div>
    </div>
  );
};

export default TopLoader;
