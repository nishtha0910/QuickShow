import React from 'react';
import Navbar from './components/Navbar';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import Movies from './pages/Movies';
import MyBookings from './pages/MyBookings';
import {Toaster} from 'react-hot-toast'
import Footer from './components/Footer';
import Favorite from './pages/Favorite';
import HeroSection from "./components/HeroSection";
import FeaturedSection from "./components/FeaturedSection";
import TrailerSection from "./components/TrailerSection";
import ListBookings from './pages/admin/ListBookings';
import ListShows from './pages/admin/ListShows';
import Dashboard from './pages/admin/Dashboard';
import Layout from './pages/admin/Layout';
import AddShow from './pages/admin/AddShow';

const App = ()=>{
  const isAdminroute = useLocation().pathname.startsWith('/admin')
  return(
    
    <> 
    <Toaster />
    {!isAdminroute  && <Navbar/>}
    <Routes>
        <Route path= '/' element={<Home/>}/> 
        <Route path= '/movies' element={<Movies/>}/> 
        <Route path= '/movies/:id' element={<MovieDetails/>}/> 
        <Route path= '/movies/:id/:date' element={<SeatLayout/>}/> 
        <Route path= '/my-bookings' element={<MyBookings/>}/> 
        <Route path= '/favorite' element={<Favorite/>}/> 
       
  <Route path="/admin" element={<Layout />}>
  <Route index element={<Dashboard />} />
  <Route path="add-shows" element={<AddShow />} />
  <Route path="list-shows" element={<ListShows />} />
  <Route path="list-bookings" element={<ListBookings />} />
</Route>

    </Routes>
    {!isAdminroute  && <Footer />}
    </>
    
    
  )
}
export default App;
