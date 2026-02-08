function apiGet(path) {
    return $.get(`${window.APP_CONFIG.API_URL}${path}`);
  }
  
  function apiPost(path, data) {
    return $.ajax({
      url: `${window.APP_CONFIG.API_URL}${path}`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(data)
    });
  }
  