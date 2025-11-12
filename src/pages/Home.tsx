import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Shield, MapPin, Clock, CreditCard, Search, Filter, ChevronRight, Tent, Compass, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHomepageSections, HomepageSection } from '../lib/homepage';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import clsx from 'clsx';

// Icon mapping object
const iconMap = {
  Calendar,
  Users,
  Shield,
  MapPin,
  Clock,
  CreditCard,
  Search,
  Filter,
  ChevronRight,
  Tent,
  Compass,
  Award
};

interface Camp {
  id: string;
  name: string;
  type: 'hotelik' | 'zlot' | 'turnus';
  start_date: string;
  end_date: string;
  price: number;
  capacity: number;
  location: string;
}

interface CampTypeDescription {
  type: 'hotelik' | 'zlot' | 'turnus';
  label: string;
  description: string;
}

// Type configuration with icons
const typeConfig = {
  hotelik: { Icon: Tent },
  zlot: { Icon: Compass },
  turnus: { Icon: Award }
};

export function Home() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [activeType, setActiveType] = useState<'hotelik' | 'zlot' | 'turnus' | 'all'>('all');
  const [typeDescriptions, setTypeDescriptions] = useState<CampTypeDescription[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    fetchCamps();
    fetchTypeDescriptions();
    fetchHomepageSections();
  }, []);

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase
        .from('camps')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCamps(data || []);
    } catch (error) {
      console.error('Error fetching camps:', error);
      toast.error('Nie udało się pobrać listy obozów');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeDescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_type_descriptions')
        .select('*')
        .order('type');

      if (error) throw error;
      setTypeDescriptions(data || []);
    } catch (error) {
      console.error('Error fetching type descriptions:', error);
    }
  };

  const fetchHomepageSections = async () => {
    try {
      const { data, error } = await getHomepageSections();
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching homepage sections:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Shield;
  };

  const filteredCamps = camps.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === 'all' || camp.type === activeType;
    const isColony = searchTerm.toLowerCase() === 'kolonie' ? 
      camp.name.toLowerCase().includes('kolonia') : true;

    return matchesSearch && matchesType && isColony;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderSection = (section: HomepageSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative h-[600px] rounded-2xl overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: `url("${section.content.backgroundImage}")`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 flex items-center justify-center">
              <div className="text-center text-white max-w-3xl px-4">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                  {section.title}
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-xl md:text-2xl mb-10 leading-relaxed"
                >
                  {section.subtitle}
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <Link
                    to={section.content.buttonLink}
                    className="relative group inline-flex items-center"
                  >
                    <div className="absolute inset-0 bg-green-400 rounded-lg blur group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative bg-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all transform hover:scale-105 duration-300 flex items-center space-x-2">
                      <span>{section.content.buttonText}</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.section>
        );

      case 'stats':
        return (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-12 bg-white rounded-2xl shadow-soft-xl"
          >
            <div className="max-w-7xl mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12">{section.title}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {section.content.stats.map((stat: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      <CountUp
                        end={stat.value}
                        suffix={stat.suffix}
                        duration={2.5}
                        enableScrollSpy
                        scrollSpyOnce
                      />
                    </div>
                    <p className="text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        );

      case 'features':
        return (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-12 bg-white rounded-2xl shadow-soft-xl"
          >
            <div className="max-w-7xl mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12">{section.title}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {section.content.features.map((feature: any, index: number) => {
                  const Icon = getIconComponent(feature.icon);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 }}
                      className="text-center group"
                    >
                      <div className="bg-green-50 p-6 rounded-2xl mb-6 transform group-hover:scale-105 transition-all duration-300 relative">
                        <div className="absolute inset-0 bg-green-400/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <Icon className="h-16 w-16 mx-auto text-green-600 relative" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        );

      case 'camps':
        return (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <h2 className="text-3xl font-bold mb-6 md:mb-0">{section.title}</h2>
                  {section.content.filters.showSearch && (
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Szukaj obozu..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      {section.content.filters.showDateFilter && (
                        <select
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          <option value="all">Wszystkie terminy</option>
                          <option value="winter">Zimowiska</option>
                          <option value="summer">Obozy letnie</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {section.content.filters.showTypeFilter && (
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={() => setActiveType('all')}
                      className={clsx(
                        'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                        activeType === 'all'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      Wszystkie
                    </button>
                    {typeDescriptions.map((desc) => (
                      <button
                        key={desc.type}
                        onClick={() => setActiveType(desc.type)}
                        className={clsx(
                          'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                          activeType === desc.type
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {React.createElement(typeConfig[desc.type].Icon, { className: "h-5 w-5" })}
                        {desc.label}
                      </button>
                    ))}
                  </div>
                )}

                {activeType !== 'all' && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 p-6 rounded-xl text-center"
                  >
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      {typeDescriptions.find(desc => desc.type === activeType)?.label}
                    </h3>
                    <p className="text-green-600">
                      {typeDescriptions.find(desc => desc.type === activeType)?.description}
                    </p>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCamps.map((camp, index) => (
                    <motion.div
                      key={camp.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-soft-xl overflow-hidden transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="relative">
                        <img 
                          src={camp.name.includes('ZIMOWISKO') 
                            ? 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?auto=format&fit=crop&q=80'
                            : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80'
                          }
                          alt={camp.name}
                          className="w-full h-56 object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full font-semibold">
                          {camp.price} zł
                        </div>
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-green-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          {React.createElement(typeConfig[camp.type].Icon, { className: "h-4 w-4" })}
                          {typeDescriptions.find(desc => desc.type === camp.type)?.label}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-4">{camp.name}</h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-5 w-5 text-green-600" />
                            <span>{camp.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-5 w-5 text-green-600" />
                            <span>{formatDate(camp.start_date)} - {formatDate(camp.end_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-5 w-5 text-green-600" />
                            <span>Dostępne miejsca: {camp.capacity}</span>
                          </div>
                        </div>
                        <Link
                          to="/registration"
                          className="relative group w-full inline-flex items-center justify-center"
                        >
                          <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                          <div className="relative w-full bg-green-600 py-3 rounded-lg font-semibold text-white hover:bg-green-700 transition flex items-center justify-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            <span>Zarezerwuj miejsce</span>
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <React.Fragment key={section.id}>
          {renderSection(section)}
        </React.Fragment>
      ))}
    </div>
  );
}