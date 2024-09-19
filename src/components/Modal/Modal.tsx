import { FC } from "react";

interface ModalProps {
  isModalOpen: boolean;
  onClose: () => void;
}

const Modal: FC<ModalProps> = ({ isModalOpen, onClose }) => {
  return (
    <>
      <input
        type="checkbox"
        id="my-modal"
        className="modal-toggle"
        defaultChecked={isModalOpen}
      />
      <div className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h2 className="text-lg font-bold">🚧 Estamos em reforma 🚧</h2>
          <p>
            Ainda estou em processo de criação do projeto, por hora nao tem
            muita coisa mas fique a vontade para usar como bem entender
          </p>
          <p>
            inclusive, toda ajuda é bem vinda, caso queira contribuir ou somente
            dar uma sugestão, só abrir uma issue aqui 😅
          </p>
          <div className="modal-action">
            <a
              href="https://github.com/ApenasGabs/querocasa/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Contribuir 🌚
            </a>
            <label
              htmlFor="my-modal"
              className="btn btn-primary"
              onClick={onClose}
            >
              Ver projeto 👀
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
