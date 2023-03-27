export default {
  style: [
    {
      selector: 'node',
      style: {
        width: 'mapData(size, 10, 30.0, 25, 50)',
        height: 'mapData(size, 10, 30.0, 25, 50)',
        'font-weight': 'bold',
        content: 'data(label)',
        'text-valign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': 140,
        'background-color': 'data(color)',
        color: '#000000ff',
      },
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        width: 'mapData(width, 1, 1.5, 1, 10)',
        'target-arrow-shape': 'triangle',
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'font-weight': 'bold',
      },
    },
    {
      selector: 'edge.label',
      style: {
        'line-color': 'orange',
        'target-arrow-color': 'orange',
      },
    },
  ],
};
