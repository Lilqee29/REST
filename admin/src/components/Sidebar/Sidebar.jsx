import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
import { Package, List, ShoppingCart, Star, Tag, Mail,ChartLine } from 'lucide-react'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
        <p>Kebab Express</p>
      </div>

      <div className="sidebar-options">
       <NavLink to='analytics' className="sidebar-option">
          <ChartLine  size={20} />
          <span>Analytics</span>
        </NavLink>

        <NavLink to='add' className="sidebar-option">
          <Package size={20} />
          <span>Add Items</span>
        </NavLink>

        <NavLink to='list' className="sidebar-option">
          <List size={20} />
          <span>List Items</span>
        </NavLink>

        <NavLink to='orders' className="sidebar-option">
          <ShoppingCart size={20} />
          <span>Orders</span>
        </NavLink>

        <NavLink to='review' className="sidebar-option">
          <Star size={20} />
          <span>Reviews</span>
        </NavLink>

        <NavLink to='promo' className="sidebar-option">
          <Tag size={20} />
          <span>Promo Codes</span>
        </NavLink>

        <NavLink to='newsletter' className="sidebar-option">
          <Mail size={20} />
          <span>Newsletter</span>
        </NavLink>


      </div>

      <div className="sidebar-footer">
        <p>Kebab Express © 2024</p>
      </div>
    </div>
  )
}

export default Sidebar