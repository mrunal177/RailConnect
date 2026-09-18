import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  Train,
  Search,
  Compass,
  Sparkles,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import SearchForm from '../../components/railway/SearchForm';
import TrainCard from '../../components/railway/TrainCard';
import RouteVisualizer from '../../components/railway/RouteVisualizer';
import Button from '../../components/common/Button';
import { MOCK_TRAINS } from '../../mock/mockData';

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const trainRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // GSAP Hero Train Animation
    const ctx = gsap.context(() => {
      // Train arrival timeline
      gsap.fromTo(
        trainRef.current,
        { x: '-120%', opacity: 0 },
        { x: '0%', opacity: 1, duration: 1.8, ease: 'power3.out', delay: 0.3 }
      );

      // Hero text entrance
      gsap.from('.hero-anim', {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.2
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleSearch = (searchParams) => {
    navigate('/search', { state: searchParams });
  };

  return (
    <div className="min-h-screen bg-[#0d1929] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-10 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="hero-anim inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold w-fit shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Intelligent Railway DBMS Platform</span>
            </div>

            <h1 className="hero-anim text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
              Next-Gen <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Railway Operations
              </span> <br />
              & Booking AI
            </h1>

            <p className="hero-anim text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Experience seamless train reservations, live route tracking, instant PNR verification, and intelligent passenger sentiment analytics.
            </p>

            <div className="hero-anim flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={Search}
                onClick={() => navigate('/search')}
                className="px-8 shadow-cyan-500/30"
              >
                Book Tickets Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                icon={Compass}
                onClick={() => navigate('/passenger')}
              >
                Passenger Portal
              </Button>
            </div>
          </div>

          {/* Hero Animated Visual (Train Graphic) */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="w-full glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase">Live Express Line</span>
              </div>

              {/* Animated Train Graphic */}
              <div className="relative py-8 flex flex-col items-center justify-center">
                {/* Track Line */}
                <div ref={trackRef} className="w-full h-2 rounded-full rail-track-line mb-6 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/40" />
                </div>

                {/* Train Body */}
                <div ref={trainRef} className="flex items-center gap-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-4 rounded-2xl shadow-xl shadow-cyan-500/20 text-white border border-cyan-300/30 w-full">
                  <div className="p-3 rounded-xl bg-slate-950/40 text-cyan-300">
                    <Train className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold text-cyan-200">TRAIN #22436</span>
                    <h4 className="text-base font-bold text-white">Vande Bharat Express</h4>
                    <p className="text-[11px] text-cyan-100 flex items-center gap-2 mt-0.5">
                      <span>NDLS &rarr; CSMT</span>
                      <span className="bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">160 km/h</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Punctuality: <strong className="text-emerald-400 font-bold">99.4%</strong></span>
                <span>Active Seats: <strong className="text-cyan-400 font-bold">Available</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Interactive Train Search Component */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" /> Instant Train Search
            </h2>
            <span className="text-xs text-slate-400">Search routes across India</span>
          </div>
          <SearchForm onSearch={handleSearch} />
        </div>
      </section>

      {/* Live Route Visualizer Demonstration */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h3 className="text-xl font-bold text-white mb-2">Live Journey Tracking Demonstration</h3>
        <p className="text-xs text-slate-400 mb-6">Real-time station node check-in and dynamic track visualizer</p>
        <RouteVisualizer />
      </section>

      {/* Featured Trains Listing */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Popular Express Trains</h3>
            <p className="text-xs text-slate-400">Daily high-speed routes</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
            View All Trains &rarr;
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MOCK_TRAINS.slice(0, 2).map((t) => (
            <TrainCard key={t.id} train={t} onSelectClass={() => navigate('/search')} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">RailConnect AI Platform</span>
            <span>— College DBMS Project Template</span>
          </div>
          <p>© 2026 RailConnect Team. Clean Modular Architecture.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
