import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { Map, TileLayer, Marker } from "react-leaflet";
import api from "../../services/api";

import { LeafletMouseEvent } from "leaflet";

import "./styles.css";
import logo from "../../assets/logo.svg";

import DropZone from "../../Components/Dropzone";

interface Item {
  id: number;
  name: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const CreatePoint: React.FC = () => {
  const history = useHistory();

  let [items, setItems] = useState<Item[]>([]);

  let [ufs, setUfs] = useState<string[]>([]);

  let [selectedUf, setSelectedUf] = useState("0");

  let [selectedCity, setSelectedCity] = useState("0");
  let [selectedItens, setSelectedItens] = useState<number[]>([]);
  let [selectedFile, setSelectedFile] = useState<File>();

  let [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  let [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  let [cities, setCities] = useState<string[]>([]);

  let [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position);
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    api.get("items").then((resp) => {
      //console.log(resp);
      setItems(resp.data.serializedItems);
    });
  }, []);

  useEffect(() => {
    axios
      .get<IBGEUFResponse[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
      )
      .then((resp) => {
        const ufInitials = resp.data.map((uf) => uf.sigla);
        setUfs(ufInitials);
      });
  }, []);

  useEffect(() => {
    if (selectedUf === "0") {
      return;
    }

    axios
      .get<IBGECityResponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
      )
      .then((resp) => {
        const cityNames = resp.data.map((city) => city.nome);
        setCities(cityNames);
      });
  }, [selectedUf]);

  const handlerSelectUf = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
    setSelectedUf(e.target.value);
  };

  const handlerSelectCity = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
    setSelectedCity(e.target.value);
  };

  const handleMapClick = (event: LeafletMouseEvent) => {
    console.log({ ...event });
    console.log(event.latlng);
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  };

  const handleinputChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.name, event.target.value);
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectedItem = (id: number) => {
    const alreadySelected = selectedItens.findIndex((item) => item === id);

    if (alreadySelected >= 0) {
      const filteredItesm = selectedItens.filter((item) => item !== id);
      setSelectedItens(filteredItesm);
    } else {
      setSelectedItens([...selectedItens, id]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItens;

    // const data = {
    //   name,
    //   email,
    //   whatsapp,
    //   uf,
    //   city,
    //   latitude,
    //   longitude,
    //   items,
    // };

    const data = new FormData();
    data.append("name", name);
    data.append("email", email);
    data.append("whatsapp", whatsapp);
    data.append("uf", uf);
    data.append("city", city);
    data.append("latitude", String(latitude));
    data.append("longitude", String(longitude));
    data.append("items", items.join(","));

    if (selectedFile) {
      data.append("image", selectedFile);
    }

    console.log(data);
    await api.post("/points", data);

    alert("Ponto de coleta Criado");
    history.push("/");
  };

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br />
          ponto de coleta
        </h1>

        <DropZone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleinputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleinputChange}
              />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleinputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map
            // center={[-23.6997613, -46.609617]}
            center={initialPosition}
            zoom={18}
            onClick={handleMapClick}
          >
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* <Marker position={[-23.6997613, -46.609617]} /> */}
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUf}
                onChange={handlerSelectUf}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => (
                  <option value={uf} key={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handlerSelectCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option value={city} key={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.length > 0
              ? items.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleSelectedItem(item.id)}
                    className={
                      selectedItens.includes(item.id) ? "selected" : ""
                    }
                  >
                    <img src={item.image_url} alt={item.name} />
                    <span>{item.name}</span>
                  </li>
                ))
              : ""}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
