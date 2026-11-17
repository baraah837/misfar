import { useState } from "react";

function Profile() {
  const [user] = useState({ name: "", email: "" });

  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
export default Profile;