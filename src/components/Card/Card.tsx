interface CardProps {
  buttonContent?: string;
  img?: string;
  title?: string;
  description?: string;
  link?: string;
}
const Card = ({
  buttonContent = "Quero 🏡",
  description = "Loren ipslun?",
  img = "https://pacaembu.com/svg/ic-mcmv.svg",
  title = "Loren",
  link = "",
}: CardProps) => {
  return (
    <div className="card bg-base-100 image-full w-full shadow-xl">
      <figure>
        <img src={img} className="logo react" alt="i" />
      </figure>
      <div className="card-body">
        <h2 className="card-title"> {title}</h2>
        <p> {description}</p>
        <div className="card-actions justify-end">
          <a
            href={link}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {buttonContent}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Card;
