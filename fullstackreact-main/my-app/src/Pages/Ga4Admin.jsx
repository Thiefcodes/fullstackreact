import React, { useEffect, useState } from "react";
import { AiOutlineBarChart } from "react-icons/ai"; // Bar chart icon

const cardStyle = {
  maxWidth: 600,
  margin: "3rem auto",
  padding: "2rem",
  borderRadius: 18,
  boxShadow: "0 2px 16px 0 rgba(0,0,0,0.09)",
  background: "#fff"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "1rem"
};

const thStyle = {
  borderBottom: "2px solid #ddd",
  textAlign: "left",
  padding: "8px"
};

const tdStyle = {
  borderBottom: "1px solid #f4f4f4",
  padding: "8px"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.7rem",
  fontSize: "1.5rem"
};

const Ga4Admin = () => {
  const [pageViews, setPageViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/ga4/pageviews")
      .then((res) => res.json())
      .then((data) => {
        setPageViews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch GA4 data", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <AiOutlineBarChart color="#4285f4" size={32} />
        <b>GA4 Page Views (Last 7 Days)</b>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Page Path</th>
              <th style={thStyle}>Views</th>
            </tr>
          </thead>
          <tbody>
            {pageViews.map((row, i) => (
              <tr key={i} style={{ transition: "background 0.2s" }}>
                <td style={tdStyle}>
                  {/* Optionally add a 📈 emoji or icon for flair */}
                  <span role="img" aria-label="analytics">📈</span> {row.pagePath}
                </td>
                <td style={tdStyle}>{row.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Ga4Admin;