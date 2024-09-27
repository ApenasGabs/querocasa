const ThemeSelector = () => {
  const setTheme = (theme: string) => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  };

  const theme = localStorage.getItem("theme");
  if (theme) {
    setTheme(theme);
  }

  const ThemeList = [
    "light",
    "dark",
    "cupcake",
    "bumblebee",
    "emerald",
    "corporate",
    "synthwave",
    "retro",
    "cyberpunk",
    "valentine",
    "halloween",
    "garden",
    "forest",
    "aqua",
    "lofi",
    "pastel",
    "fantasy",
    "wireframe",
    "black",
    "luxury",
    "dracula",
    "cmyk",
    "autumn",
    "business",
    "acid",
    "lemonade",
    "night",
    "coffee",
    "winter",
    "dim",
    "nord",
    "sunset",
  ];

  const ThemeOptions = ThemeList.map((theme) => (
    <li key={theme}>
      <input
        type="radio"
        name="theme-dropdown"
        className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
        aria-label={theme.charAt(0).toUpperCase() + theme.slice(1)}
        value={theme}
        onClick={() => setTheme(theme)}
      />
    </li>
  ));

  return (
    <div className="text-xl">
      <div className="drawer drawer-end">
        <input id="theme-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <label
            htmlFor="theme-drawer"
            className="btn btn-sm btn-ghost text-xl"
          >
            Temas
          </label>
        </div>
        <div className="drawer-side z-[1]">
          <label htmlFor="theme-drawer" className="drawer-overlay"></label>
          <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 pt-10">
            {ThemeOptions}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
