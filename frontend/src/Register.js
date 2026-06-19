import { useState } from 'react';
import { API_BASE_URL } from './config';

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState(''); 

 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.text();

      if (response.ok) {
        setMessage(`Success: ${data}`); 
        setFormData({ name: '', email: '', password: '' });
      } else {
        setMessage(`Error: ${data}`); 
      }
    } catch (error) {
      setMessage('Failed to connect to the server.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm p-4">
            <h2 className="text-center mb-4 text-secondary">Create an Account</h2>
            
            {message && (
              <div className={`alert ${message.startsWith('Success') ? 'alert-success' : 'alert-danger'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" name="name" className="form-control" 
                  value={formData.name} onChange={handleChange} required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" name="email" className="form-control" 
                  value={formData.email} onChange={handleChange} required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input 
                  type="password" name="password" className="form-control" 
                  value={formData.password} onChange={handleChange} required 
                />
              </div>

              <button type="submit" className="btn btn-primary w-full w-100 mt-2">
                Sign Up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}