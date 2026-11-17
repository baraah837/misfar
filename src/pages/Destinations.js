import { Link } from "react-router-dom";

function Destinations() {
  const data = [
    { id: 1, name: "Nizwa" },
    { id: 2, name: "Muscat" }
  ];

  return (
    <div>
      {data.map((item) => (
        <Link key={item.id} to={`/destination/${item.id}`}>
          <div>
            <h3>{item.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
export default Destinations;