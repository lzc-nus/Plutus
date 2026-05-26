'use client';

import React, { useState } from 'react';
import PasswordValidator from '@/components/auth/PasswordValidator';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSignUp = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        
    }
}