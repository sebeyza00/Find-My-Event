import { useState, useEffect } from 'react';
import './App.css'
import axios from 'axios'; // For Axios

function App() {
  const clientId = import.meta.env.VITE_SEATGEEK_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SEATGEEK_CLIENT_SECRET;
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ geolocation: { city: "Unknown" } });
  const [mostPopularEvent, setMostPopularEvent] = useState("");
  const [mostPopularEventScore, setMostPopularEventScore] = useState(0);
  const [lowestPrice, setLowestPrice] = useState(100000000);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermPopularity, setSearchTermPopularity] = useState("all");

  const fetchPage = async (url) => {
    try {
      const response = await axios.get(url);
      const { events, meta } = response.data;
      setEvents(events);
      setMeta(meta);
      console.log("printing meta");
      console.log(meta.geolocation.city);
      console.log("printing new events");
      console.log(events);
    } catch (error) {
      console.error('Error fetching page:', error);
    }
  }

  useEffect(() => {
    fetchPage(`https://api.seatgeek.com/2/events?client_id=${clientId}&client_secret=${clientSecret}&geoip=true&per_page=30`);
  }, []);

  function formatDateTime(datetime) {
    const date = new Date(datetime);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  function getHour(datetime) {
    const date = new Date(datetime);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return hours + ' ' + ampm;
  }

  function popularityTranslator(event) {
    if (event.score === null) {
      return "Unknown";
    }
    if (event.score < 0) {
      return "Invalid";
    }
    if (event.score > mostPopularEventScore) {
      setMostPopularEventScore(event.score);
      setMostPopularEvent(event.title);
    };

    if (event.stats.lowest_price < lowestPrice && event.stats.lowest_price !== null) {
      setLowestPrice(event.stats.lowest_price);
    }

    if (event.score >= 0 && event.score <= 0.2) {
      return "Low";
    } else if (event.score > 0.2 && event.score <= 0.4) {
      return "Medium";
    } else if (event.score > 0.4 && event.score <= 0.6) {
      return "High";
    } else if (event.score > 0.6 && event.score <= 0.8) {
      return "Very High";
    } else {
      return "Extremely High";
    }
  }

  return (
    <>
      <div className="App">
        <div className="left-container">
          <div className='title-container'>
            <h1>🎉</h1>
            <h1>Event Flow</h1>
          </div>
          <p>Don't know what to do? Check out these events near you!</p>
          <p>Current Location: {meta.geolocation.display_name}</p>
          <p> Search for events:</p>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search events..." />
          <p>Filter events by popularity:</p>
          <button onClick={() => { setSearchTerm(''); setSearchTermPopularity('all'); }}>Show All</button>
          <button onClick={() => setSearchTermPopularity("Low")}>Low</button>
          <button onClick={() => setSearchTermPopularity("Medium")}>Medium</button>
          <button onClick={() => setSearchTermPopularity("High")}>High</button>
          <button onClick={() => setSearchTermPopularity("Very High")}>Very High</button>
          <button onClick={() => setSearchTermPopularity("Extremely High")}>Extremely High</button>

        </div>

        <div className="right-container">
          <div className="widgets-container">
            <div className="widget">
              <h2>🎟️</h2>
              <p>Events: {events.length}</p>
            </div>
            <div className="widget">
              <h2>🌐</h2>
              <p>Lowest Price: ${lowestPrice}</p>
            </div>
            <div className="widget">
              <h2>📅</h2>
              <p>Today: {formatDateTime(new Date())}</p>
            </div>
            <div className="widget">
              <h2>🔥</h2>
              <p>{mostPopularEvent}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Performers</th>
                <th>Score (Popularity)</th>
                <th>Lowest Price</th>
                <th>Average Price</th>
                <th>Tickets</th>
              </tr>
            </thead>
            <tbody>
              {events.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase())).filter(event => searchTermPopularity === 'all' || popularityTranslator(event).toLowerCase() === searchTermPopularity.toLowerCase())
                .map(event => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{event.venue.name}</td>
                    <td>{formatDateTime(event.datetime_local)}</td>
                    <td>{getHour(event.datetime_local)}</td>
                    <td>{event.performers.map(performer => performer.name).join(', ')}</td> {/* New cell */}
                    <td>{popularityTranslator(event)}</td>
                    <td>${event.stats.lowest_price}</td>
                    <td>${event.stats.average_price}</td>
                    <td><a href={event.url}>Get Tickets Here!</a></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </>
  )
}

export default App