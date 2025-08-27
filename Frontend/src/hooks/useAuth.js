import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user') ||
                sessionStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from storage", error);
            // Clear corrupted storage
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return { user, logout, loading };
};

export default useAuth;