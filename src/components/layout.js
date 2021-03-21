import * as React from "react";
import PropTypes from "prop-types";
import { useStaticQuery, graphql } from "gatsby";
import "./bootstrap.min.css";
import "./layout.css";
import Navbar from './global/navbar';
import Footer from './global/footer';

const Layout = ({ children }) => (
<>
<Navbar/>
{children}
<Footer/>
</>
);

Layout.propTypes = {

  children: PropTypes.node.isRequired,
}

export default Layout
