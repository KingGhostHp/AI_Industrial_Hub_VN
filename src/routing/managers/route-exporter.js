/**
 * RouteExporter
 * 
 * Exports routes to various formats (GeoJSON, GPX) and generates share URLs.
 */

class RouteExporter {
  /**
   * Export route to GeoJSON format
   * @param {import('../types/index.js').Route} route
   * @param {import('../types/index.js').Waypoint[]} waypoints
   * @returns {string} GeoJSON string
   */
  exportGeoJSON(route, waypoints) {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Route',
            distance: route.distance,
            duration: route.duration,
            travelMode: route.travelMode,
            createdAt: route.createdAt,
          },
          geometry: route.geometry,
        },
        ...waypoints.map((waypoint, index) => ({
          type: 'Feature',
          properties: {
            name: waypoint.name,
            type: waypoint.type,
            order: index,
          },
          geometry: {
            type: 'Point',
            coordinates: waypoint.coordinates,
          },
        })),
      ],
    };

    return JSON.stringify(geojson, null, 2);
  }

  /**
   * Export route to GPX format
   * @param {import('../types/index.js').Route} route
   * @param {import('../types/index.js').Waypoint[]} waypoints
   * @returns {string} GPX XML string
   */
  exportGPX(route, waypoints) {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Route Planning App" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Route</name>
    <time>${new Date(route.createdAt).toISOString()}</time>
  </metadata>
  ${waypoints.map((wp, index) => `
  <wpt lat="${wp.coordinates[1]}" lon="${wp.coordinates[0]}">
    <name>${this.escapeXml(wp.name)}</name>
    <type>${wp.type}</type>
  </wpt>`).join('')}
  <trk>
    <name>Route</name>
    <type>${route.travelMode}</type>
    <trkseg>
      ${route.geometry.coordinates.map(coord => `
      <trkpt lat="${coord[1]}" lon="${coord[0]}">
      </trkpt>`).join('')}
    </trkseg>
  </trk>
</gpx>`;

    return gpx;
  }

  /**
   * Generate shareable URL
   * @param {import('../types/index.js').Route} route
   * @param {import('../types/index.js').Waypoint[]} waypoints
   * @returns {string} Share URL
   */
  generateShareURL(route, waypoints) {
    if (waypoints.length < 2) {
      throw new Error('At least origin and destination required');
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(1, -1);

    const params = new URLSearchParams();
    
    // Origin
    params.append('o', `${origin.coordinates[1]},${origin.coordinates[0]}`);
    
    // Destination
    params.append('d', `${destination.coordinates[1]},${destination.coordinates[0]}`);
    
    // Intermediate waypoints
    if (intermediateWaypoints.length > 0) {
      const waypointsStr = intermediateWaypoints
        .map(wp => `${wp.coordinates[1]},${wp.coordinates[0]}`)
        .join(';');
      params.append('w', waypointsStr);
    }
    
    // Travel mode
    params.append('m', route.travelMode);

    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?${params.toString()}`;
  }

  /**
   * Parse share URL
   * @param {string} url - Share URL
   * @returns {import('../types/index.js').ShareURLData | null}
   */
  parseShareURL(url) {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const originStr = params.get('o');
      const destinationStr = params.get('d');
      const waypointsStr = params.get('w');
      const travelMode = params.get('m');

      if (!originStr || !destinationStr) {
        return null;
      }

      // Parse origin
      const [originLat, originLng] = originStr.split(',').map(Number);
      const origin = {
        id: 'origin',
        name: 'Origin',
        coordinates: [originLng, originLat],
        type: 'origin',
      };

      // Parse destination
      const [destLat, destLng] = destinationStr.split(',').map(Number);
      const destination = {
        id: 'destination',
        name: 'Destination',
        coordinates: [destLng, destLat],
        type: 'destination',
      };

      // Parse waypoints
      const waypoints = [];
      if (waypointsStr) {
        const waypointPairs = waypointsStr.split(';');
        waypointPairs.forEach((pair, index) => {
          const [lat, lng] = pair.split(',').map(Number);
          waypoints.push({
            id: `waypoint_${index}`,
            name: `Waypoint ${index + 1}`,
            coordinates: [lng, lat],
            type: 'waypoint',
          });
        });
      }

      return {
        origin,
        destination,
        waypoints,
        travelMode: travelMode || 'driving',
      };
    } catch (error) {
      console.error('Failed to parse share URL:', error);
      return null;
    }
  }

  /**
   * Escape XML special characters
   * @param {string} str
   * @returns {string}
   */
  escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Download file
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Export as default for ES6 modules
export default RouteExporter;
