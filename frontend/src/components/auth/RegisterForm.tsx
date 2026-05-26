'use client';

import React, { useState } from 'react';
import PasswordValidator from '@/components/auth/PasswordValidator';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const handleSignUp = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://127.0.0.1:8000/api/auth/register')
        }
    }
}