"use client";
import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
    return (
        <Toaster 
            position="top-center" 
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#333',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    fontWeight: '500'
                },
                success: {
                    iconTheme: {
                        primary: '#28a745',
                        secondary: '#fff',
                    },
                },
                error: {
                    style: {
                        background: '#dc3545',
                    }
                }
            }} 
        />
    );
}
