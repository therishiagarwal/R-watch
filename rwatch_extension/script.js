document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("saveButton").addEventListener("click", function () {
      const username = document.getElementById("username").value.trim();
      const errorElement = document.getElementById("error");
  
      if (!username) {
        errorElement.textContent = "Please enter your name";
        return;
      }
  
      chrome.runtime.sendMessage(
        { action: "setUsername", username: username },
        function (response) {
          if (response && response.success) {
            window.close();
          } else {
            errorElement.textContent = "Error saving username. Please try again.";
          }
        }
      );
    });
  });
  