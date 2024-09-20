interface CardProps {
  buttonContent?: string;
  description?: string;
  img?: string;
  link?: string;
  title?: string;
  price?: string;
}
const Card = ({
  buttonContent = "Quero 🏡",
  description = "Loren ipslun?",
  price = "R$ 0,00",
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
          <p className="self-center"> {price}</p>
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
