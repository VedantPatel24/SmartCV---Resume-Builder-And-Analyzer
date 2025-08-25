import React,{useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/auth.css';

function Login(){
	const navigate = useNavigate();
	const [formData, setFormData] = useState({email:'',password:''});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleChange = (e) => {
		setFormData({...formData,[e.target.name]:e.target.value});
		setError(''); // Clear error when user types
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		
		try{
			const res = await axios.post('http://localhost:8000/login',formData,  { headers: { "Content-Type": "application/json" } });
			localStorage.setItem("token",res.data.token);
			localStorage.setItem("isAdmin", res.data.is_admin);
			localStorage.setItem("username", res.data.username);
			localStorage.setItem("email", res.data.email);
			
			// Redirect based on admin status
			if (res.data.is_admin) {
				navigate('/admin-dashboard');
			} else {
				navigate('/dashboard');
			}
		}
		catch(err){
			setError(err.response?.data?.message || 'Login failed. Please try again.');
			console.log(err);
		} finally {
			setLoading(false);
		}
	};

	return(
		<div className='auth-container'>
			<div className='auth-card'>
				<div className='auth-header'>
					<div className='auth-logo'>SmartCV</div>
					<p className='auth-subtitle'>Welcome back! Please sign in to your account.</p>
				</div>
				
				{error && <div className='message error'>{error}</div>}
				
				<form className='auth-form' onSubmit={handleSubmit}>
					<div className='form-group'>
						<input 
							name='email' 
							type='email' 
							placeholder='Email address' 
							className='form-input'
							value={formData.email}
							onChange={handleChange} 
							required
						/>
					</div>
					
					<div className='form-group'>
						<input 
							name='password' 
							type='password' 
							placeholder='Password' 
							className='form-input'
							value={formData.password}
							onChange={handleChange} 
							required
						/>
					</div>
					
					<button type='submit' className='btn btn-primary' disabled={loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>
				
				<div className='auth-divider'>
					<span>or</span>
				</div>
				
				<button 
					type='button' 
					onClick={() => navigate('/register')} 
					className='btn btn-secondary'
				>
					Create new account
				</button>
				
				<div className='auth-footer'>
					<p>Don't have an account? Register to get started with ResumeAI</p>
				</div>
			</div>
		</div>
	);
}

export default Login;