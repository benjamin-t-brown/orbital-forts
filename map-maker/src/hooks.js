import { useState, useEffect } from 'react';

const cache = {};

const getCacheKey = (type, url) => {
  return type + '/' + url;
};

export const useFetch = (type, url, params) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      const cachedData = cache[getCacheKey(type, url)];
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
      } else {
        const opts = {
          method: type,
          headers: {},
          body: params,
        };
        console.log('[fetch]', type, url, params || '');
        await fetch(url, opts)
          .then(async function(response) {
            const json = await response.json();
            cache[getCacheKey(type, url)] = json;
            setData(json);
            console.log('[fetch]', 'result', type, url, json);
            setLoading(false);
            setError(null);
          })
          .catch(err => {
            setError(err);
            setLoading(false);
          });
      }
    };
    fetchData();
  });

  return [data, loading, error];
};
