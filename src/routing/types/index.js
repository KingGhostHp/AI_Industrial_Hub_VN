/**
 * Route Planning & Navigation - Type Definitions
 * 
 * This file contains all type definitions and interfaces for the routing system.
 * Using JSDoc for type annotations in vanilla JavaScript.
 */

/**
 * @typedef {'driving-traffic' | 'driving' | 'cycling' | 'walking'} TravelMode
 * - driving-traffic: Ô tô (with real-time traffic)
 * - driving: Xe máy (without traffic)
 * - cycling: Xe đạp
 * - walking: Đi bộ
 */

/**
 * @typedef {'origin' | 'destination' | 'waypoint'} WaypointType
 */

/**
 * @typedef {Object} Waypoint
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {[number, number]} coordinates - [lng, lat]
 * @property {WaypointType} type - Type of waypoint
 * @property {string} [address] - Optional address
 * @property {string} [placeType] - Optional place type (kcn, ccn, poi, address)
 */

/**
 * @typedef {Object} RouteManeuver
 * @property {string} type - Maneuver type (turn, merge, roundabout, etc.)
 * @property {string} [modifier] - Direction modifier (left, right, straight, etc.)
 * @property {[number, number]} location - [lng, lat]
 * @property {number} [bearing_before] - Bearing before maneuver
 * @property {number} [bearing_after] - Bearing after maneuver
 */

/**
 * @typedef {Object} RouteStep
 * @property {string} instruction - Turn-by-turn instruction
 * @property {number} distance - Distance in meters
 * @property {number} duration - Duration in seconds
 * @property {GeoJSON.LineString} geometry - Step geometry
 * @property {RouteManeuver} maneuver - Maneuver details
 */

/**
 * @typedef {Object} Route
 * @property {string} id - Unique route identifier
 * @property {GeoJSON.LineString} geometry - Route geometry
 * @property {number} distance - Total distance in meters
 * @property {number} duration - Total duration in seconds
 * @property {RouteStep[]} steps - Turn-by-turn steps
 * @property {Waypoint[]} waypoints - Route waypoints
 * @property {TravelMode} travelMode - Travel mode used
 * @property {number} createdAt - Timestamp
 */

/**
 * @typedef {Object} RouteOptions
 * @property {TravelMode} travelMode - Travel mode
 * @property {boolean} alternatives - Request alternative routes
 * @property {boolean} steps - Include turn-by-turn steps
 * @property {'geojson' | 'polyline'} geometries - Geometry format
 * @property {'full' | 'simplified'} overview - Overview detail level
 */

/**
 * @typedef {Object} RouteResult
 * @property {boolean} success - Whether route calculation succeeded
 * @property {Route | null} route - Main route (null if failed)
 * @property {Route[]} alternatives - Alternative routes
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} OptimizedResult
 * @property {boolean} success - Whether optimization succeeded
 * @property {number[]} optimizedOrder - Optimized waypoint indices
 * @property {number} savedDistance - Distance saved in meters
 * @property {number} savedDuration - Duration saved in seconds
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} DirectionsOptions
 * @property {boolean} [alternatives] - Request alternative routes
 * @property {boolean} [steps] - Include turn-by-turn steps
 * @property {'geojson' | 'polyline'} [geometries] - Geometry format
 * @property {'full' | 'simplified'} [overview] - Overview detail level
 * @property {boolean} [continue_straight] - Prefer straight routes
 * @property {number[]} [waypoints] - Waypoint indices
 * @property {string[]} [waypoint_names] - Waypoint names
 */

/**
 * @typedef {Object} DirectionsResponse
 * @property {Route[]} routes - Array of routes
 * @property {Object[]} waypoints - Waypoint details
 * @property {string} code - Response code
 * @property {string} [message] - Error message if any
 */

/**
 * @typedef {Object} RouteHistoryItem
 * @property {string} id - Unique history item ID
 * @property {number} timestamp - Creation timestamp
 * @property {Waypoint} origin - Origin waypoint
 * @property {Waypoint} destination - Destination waypoint
 * @property {Waypoint[]} waypoints - Intermediate waypoints
 * @property {TravelMode} travelMode - Travel mode used
 * @property {number} distance - Total distance in meters
 * @property {number} duration - Total duration in seconds
 */

/**
 * @typedef {Object} ShareURLData
 * @property {Waypoint} origin - Origin waypoint
 * @property {Waypoint} destination - Destination waypoint
 * @property {Waypoint[]} waypoints - Intermediate waypoints
 * @property {TravelMode} travelMode - Travel mode
 */

// Export empty object for module compatibility
export {};
