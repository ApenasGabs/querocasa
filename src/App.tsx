import { useState } from "react";
import "./App.css";
import lua from "./assets/lua.png";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="" target="_blank">
          {count % 2 !== 0 && <h1 className="read-the-docs">Eu também🥹 </h1>}
          {count % 2 !== 0 && (
            <img src={lua} className="logo" alt="Vite logo" />
          )}
        </a>
        <a href="" target="_blank">
          <img
            src={"https://pacaembu.com/svg/ic-mcmv.svg"}
            className="logo react"
            alt="imagem de uma casa girando"
          />
        </a>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>Quero 🏡</button>
      </div>
    </>
  );
}

export default App;
