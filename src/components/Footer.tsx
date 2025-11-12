import React from 'react';
import { MapPin, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6 text-green-400 relative inline-block">
              <span className="relative z-10">Kontakt</span>
              <div className="absolute -bottom-1 left-0 w-full h-1 bg-green-500/20 rounded-full"></div>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group hover:text-green-400 transition-all duration-300 transform hover:translate-x-2">
                <div className="bg-green-600/20 p-2 rounded-lg group-hover:bg-green-600/30 group-hover:scale-110 transition-all duration-300">
                  <MapPin className="h-6 w-6 text-green-500" />
                </div>
                <span>ZHP Chorągiew Kielecka Hufiec Sandomierz<br />27-600 Sandomierz, ul. Puławiaków 2</span>
              </div>
              <div className="flex items-center space-x-3 group hover:text-green-400 transition-all duration-300 transform hover:translate-x-2">
                <div className="bg-green-600/20 p-2 rounded-lg group-hover:bg-green-600/30 group-hover:scale-110 transition-all duration-300">
                  <Mail className="h-6 w-6 text-green-500" />
                </div>
                <span>sandomierz@zhp.pl</span>
              </div>
              <div className="flex items-center space-x-3 group hover:text-green-400 transition-all duration-300 transform hover:translate-x-2">
                <div className="bg-green-600/20 p-2 rounded-lg group-hover:bg-green-600/30 group-hover:scale-110 transition-all duration-300">
                  <Phone className="h-6 w-6 text-green-500" />
                </div>
                <span>+48 123 456 789</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-6 text-green-400 relative inline-block">
              <span className="relative z-10">Szybkie linki</span>
              <div className="absolute -bottom-1 left-0 w-full h-1 bg-green-500/20 rounded-full"></div>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="group flex items-center space-x-2 transition-all duration-300 hover:text-green-400 transform hover:translate-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  <span>O nas</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center space-x-2 transition-all duration-300 hover:text-green-400 transform hover:translate-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  <span>Regulamin</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center space-x-2 transition-all duration-300 hover:text-green-400 transform hover:translate-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-150 transition-transform duration-300"></span>
                  <span>Polityka prywatności</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-6 text-green-400 relative inline-block">
              <span className="relative z-10">Śledź nas</span>
              <div className="absolute -bottom-1 left-0 w-full h-1 bg-green-500/20 rounded-full"></div>
            </h3>
            <div className="flex space-x-4">
              <a href="#" className="relative group">
                <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-green-600/20 p-3 rounded-lg hover:bg-green-600/30 transition-all duration-300 hover:scale-110 transform">
                  <Facebook className="h-6 w-6 text-green-500" />
                </div>
              </a>
              <a href="#" className="relative group">
                <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-green-600/20 p-3 rounded-lg hover:bg-green-600/30 transition-all duration-300 hover:scale-110 transform">
                  <Instagram className="h-6 w-6 text-green-500" />
                </div>
              </a>
              <a href="#" className="relative group">
                <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-green-600/20 p-3 rounded-lg hover:bg-green-600/30 transition-all duration-300 hover:scale-110 transform">
                  <Twitter className="h-6 w-6 text-green-500" />
                </div>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} ZHP Hufiec Sandomierz. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}