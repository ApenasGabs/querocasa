interface CardProps {
  buttonContent?: string;
  img?: string;
  title?: string;
  description?: string;
}
const Card = ({
  buttonContent = "Quero 🏡",
  description = "Loren ipslun?",
  img = "https://pacaembu.com/svg/ic-mcmv.svg",
  title = "Loren",
}: CardProps) => {
  return (
    <div className="card bg-base-100 image-full w-96 shadow-xl">
      <figure>
        <img src={img} className="logo react" alt="i" />
      </figure>
      <div className="card-body">
        <h2 className="card-title"> {title}</h2>
        <p> {description}</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">{buttonContent}</button>
        </div>
      </div>
    </div>
  );
};

export default Card;
