const defaultLinks = [
  <p className="text-xl">Outros links: </p>,
  <a
    className="btn btn-ghost text-xl"
    target="_blank"
    href="https://guia.apenasgabs.dev"
  >
    Guia de TI
    <span className="badge badge-sm badge-warning">NEW</span>
  </a>,
];

interface NavbarProps {
  links?: JSX.Element[];
}
const Navbar = ({ links = [] }: NavbarProps) => {
  const navbarLinks = links?.length ? links.concat(defaultLinks) : defaultLinks;
  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            {navbarLinks.map((navbarLink) => (
              <li>{navbarLink}</li>
            ))}
          </ul>
        </div>
        {/* <a className="btn btn-ghost text-xl">daisyUI</a> */}
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navbarLinks.map((navbarLink) => (
            <li>{navbarLink}</li>
          ))}
        </ul>
      </div>
      <div className="navbar-end" />
    </div>
  );
};

export default Navbar;
