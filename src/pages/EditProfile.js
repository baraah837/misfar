import { useState } from "react";

function EditProfile() {
  const [user, setUser] = useState({ name: "", email: "" });

  return (
    <div>
      <input
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
        placeholder="Name"
      />
      <input
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
        placeholder="Email"
      />
    </div>
  );
}
export default EditProfile;