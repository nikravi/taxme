import React, { ReactNode } from 'react'

export const navigation = {
    main: [
        { name: 'Home', href: '/', hideTopView: true },
        { name: 'Dashboard', href: '/dashboard', auth: true },
        { name: 'Disclaimer', href: '/disclaimer', hideTopView: true },
        { name: 'About', href: '/about', hideTopView: true },
        
    ],
}