import React,{useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/auth.css';

function Register(){
	const navigate = useNavigate();
	const [formData,setFormData] = useState({username:'',email:'',password:''});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleChange = (e) => {
		setFormData({...formData,[e.target.name]:e.target.value});
		setError(''); // Clear error when user types
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		setSuccess('');
		
		try{
			const res = await axios.post("http://localhost:8000/register",formData,  { headers: { "Content-Type": "application/json" } });
			setSuccess(res.data.message);
			setTimeout(() => {
				navigate('/login');
			}, 2000);
		}
		catch(err){
			setError(err.response?.data?.message || "Registration failed. Please try again.");
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
					<p className='auth-subtitle'>Create your account to get started</p>
				</div>
				
				{error && <div className='message error'>{error}</div>}
				{success && <div className='message success'>{success}</div>}
				
				<form className='auth-form' onSubmit={handleSubmit}>
					<div className='form-group'>
						<input 
							name='username' 
							type='text' 
							placeholder='Full name' 
							className='form-input'
							value={formData.username}
							onChange={handleChange} 
							required
						/>
					</div>
					
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
						{loading ? 'Creating account...' : 'Create Account'}
					</button>
				</form>
				
				<div className='auth-divider'>
					<span>or</span>
				</div>
				
				<button 
					type='button' 
					onClick={() => navigate('/login')} 
					className='btn btn-secondary'
				>
					Sign in to existing account
				</button>
				
				<div className='auth-footer'>
					<p>Already have an account? Sign in to access ResumeAI</p>
				</div>
			</div>
		</div>
	);
}

export default Register;