import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";


export default function Dashboard({currentAdmin, onLogout}) {
    const [users, setUsers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch(`${API_BASE_URL}/users?adminId=${currentAdmin.id}`);

            if(res.status === 403) {
                onLogout();
                return;
            }
            if(res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setMessage("Failed to fetch users");
            }
        } catch (err) {
            console.error("DEBUG EYEOS:", err);
            setMessage("Error connecting to the server.");
        }
    };

    function handleCheckboxChange(userId) {
        const id = Number(userId);

        setSelectedIds((prevSelected) => prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
        );

    }

    function handleSelectAll() {
        if(selectedIds.length === users.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(users.map(user => Number(user.user_id)));
        }
    }

    async function handleBulkAction(actionType) {

        if(actionType !== "delete_unverified" && selectedIds.length === 0) {
            setMessage("Please select al least one user");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/users/action`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ids: selectedIds, action: actionType, adminId: currentAdmin.id})
            });

            if (res.status === 403) {
                onLogout(); 
                return;
            }

            if(res.ok) {
                setMessage("Success!");
                setSelectedIds([]);
                fetchUsers();
            } else {
                const errMsg = await res.text();
                setMessage(`Action failed: ${errMsg}`);
            }
        } catch (err) {
            setMessage("Failed to execute the request.")
        }
    }

    return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-secondary mb-0">Welcome, {currentAdmin.name} !</h2>    
     
            <button className="btn btn-outline-danger" onClick={onLogout}>
                <i className="bi bi-box-arrow-right"></i> Log Out
            </button>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="mb-3 d-flex gap-2">
          <button className="btn btn-warning" onClick={() => handleBulkAction('block')}>
            <i className="bi bi-lock-fill"></i> Block
          </button>
          <button className="btn btn-success" onClick={() => handleBulkAction('unblock')} title="Unblock Selected User(s)">
            <i className="bi bi-unlock-fill"></i>
          </button>
          <button className="btn btn-danger" onClick={() => handleBulkAction('delete')} title="Delete Selected User(s)">
            <i className="bi bi-trash-fill"></i>
          </button>
          <button className="btn btn-secondary" onClick={() => handleBulkAction('delete_unverified')} title="Delete All Unverified Users">
            <i className="bi bi-person-x-fill"></i>
            </button>
        </div>


        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" className="form-check-input"  checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={handleSelectAll}/>
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Last seen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>
                    <input type="checkbox" className="form-check-input" checked={selectedIds.includes(Number(user.user_id))}
                    onChange={() => handleCheckboxChange(user.user_id)} />
                  </td>
                  <td>{user.user_id}</td>
                  <td>{user.user_name}</td>
                  <td>{user.user_email}</td>
                  <td>{user.last_login_time ? new Date(user.last_login_time).toLocaleString() : 'Never'}</td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'bg-success' : user.status === 'blocked' ? 'bg-danger' : 'bg-warning'}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}