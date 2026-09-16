import { Input } from "./input";

const DEFAULT_CITIES = [
  "Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze", "Bari", "Catania",
  "Venezia", "Verona", "Messina", "Padova", "Trieste", "Brescia", "Parma", "Prato", "Modena", "Reggio Calabria",
  "Perugia", "Ravenna", "Livorno", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari", "Latina",
  "Monza", "Siracusa", "Pescara", "Bergamo", "Forlì", "Trento", "Vicenza", "Terni", "Bolzano", "Novara",
  "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena", "Lecce", "Pesaro", "Barletta", "Alessandria",
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille",
  "São Paulo", "Rio de Janeiro", "Campinas", "Jaguariúna", "Pedreira", "Curitiba", "Belo Horizonte", "Brasília",
];

type Props = Omit<React.ComponentProps<typeof Input>, "list"> & {
  listId?: string;
};

export function CityInput({ listId = "binotto-city-options", ...props }: Props) {
  return (
    <>
      <Input {...props} list={listId} autoComplete="address-level2" />
      <datalist id={listId}>
        {DEFAULT_CITIES.map((city) => <option key={city} value={city} />)}
      </datalist>
    </>
  );
}
