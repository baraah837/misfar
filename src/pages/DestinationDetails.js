import { useParams } from "react-router-dom";

function DestinationDetails() {
  const { id } = useParams();

  return (
    <div>
      <h2>Destination Details</h2>
      <p>ID: {id}</p>
    </div>
  );
}
export default DestinationDetails;