import { useState } from 'react';
import { API_BASE_URL } from './config';

export default function Login({onLoginSuccess}) {
  const [formData, setFormData] = useState({email: "", password: ""});
  const [message, setMessage] = useState(''); 
 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success: ${data.message}`); 
        setFormData({ email: '', password: '' });

        onLoginSuccess(data.user);
      } else {
        setMessage(`Error: ${data.message || data}`); 
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
            <h2 className="text-center mb-4 text-secondary">Sign In to The App</h2>
            
            {message && (
              <div className={`alert ${message.startsWith('Success') ? 'alert-success' : 'alert-danger'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}