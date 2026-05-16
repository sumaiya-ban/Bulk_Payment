import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServiceSection from '../components/ServiceSection.js';
import TransactionSection from '../components/TransactionSection.js';
import PartnersSection from '../components/PartnersSection.js';
import ContactSection from '../components/ContactSection.js';
import Footer from '../components/Footer.js';
import SupportChatWidget from '../components/SupportChatWidget.js';

const Index = () => {
    return (
        <div className="min-h-screen">
            <Navbar/>
            <HeroSection/>
            <PartnersSection/>
            <ServiceSection/>
            <TransactionSection/>
            
            <ContactSection/>
            <Footer/>
            <SupportChatWidget/>
        </div> 
    );
};

export default Index;
