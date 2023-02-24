import React from 'react';
import { render } from 'react-dom';
import MainContainer, { LOCAL_STORAGE_KEY } from './components/MainContainer';

const div = document.createElement('div');
document.body.append(div);
async function main() {
  const mapName = localStorage.getItem(LOCAL_STORAGE_KEY);
  Array.prototype.forEach.call(
    document.querySelectorAll('.loading'),
    el => (el.style.display = 'none')
  );
  render(<MainContainer defaultMapName={mapName} />, div);
}
main().catch(e => {
  console.error(e);
  throw e;
});
