const GITHUB_API_URL = 'https:/api.github.com';

function getUser() {
  const user = document.getElementById('user').value;

  if (!user) {
    alert('You should inform a valid user!');
    throw Error('You should inform a valid user');
  }

  return user;
}

function getKey() {
  const key = document.getElementById('key').value;

  if (!key) {
    alert('You should inform a valid api key!');
    throw Error('You should inform a valid api key');
  }

  return key;
}

function getHeadersWithAuth(user, key = null) {
  return new Headers({
    Accept: 'application/vnd.github.v3+json',
    Authorization: 'Basic ' + btoa(user + ':' + key),
  });
}

async function requestGitHubInfo(urlEndpoint, headers) {
  let url = new URL(GITHUB_API_URL + urlEndpoint);
  let params = { per_page: 100, page: 1 };
  url.search = new URLSearchParams(params).toString();

  let requestOptions = {
    method: 'GET',
    headers: headers,
  };

  let allFollowers = [];

  while (true) {
    let request = await fetch(url, requestOptions);
    let response = await request.json();

    if (response.length === 0) {
      return allFollowers;
    }

    allFollowers.push(...response);

    ++params.page;
    url.search = new URLSearchParams(params).toString();
  }
}

function usefulUserProperties(user) {
  return {
    avatar_url: user.avatar_url,
    login: user.login,
    html_url: user.html_url,
  };
}

function filterOnlyUsefulInfo(githubUsersList) {
  return githubUsersList.map((user) => usefulUserProperties(user));
}

async function listFollowersFrom(headers) {
  let urlEndpoint = '/user/followers';
  return await requestGitHubInfo(urlEndpoint, headers);
}

async function listFollowingFrom(headers) {
  let urlEndpoint = '/user/following';
  return await requestGitHubInfo(urlEndpoint, headers);
}

function compare(whoIAmFollowing, whoFollowsMe) {
  whoIAmFollowing = whoIAmFollowing.map(
    (whoIAmFollowing) => whoIAmFollowing.login
  );
  whoFollowsMe = whoFollowsMe.map((whoFollowsMe) => whoFollowsMe.login);

  return whoIAmFollowing.filter(
    (userIAmFollowing) => !whoFollowsMe.includes(userIAmFollowing)
  ); // compareFunc => item2 == item1 or !=
}

function rebuildObjOfNotFollowingMe(whoIFollowList, notFollowingMeArr) {
  let list = [];

  for (notFollowingMeLogin of notFollowingMeArr) {
    for (whoIFollowUser of whoIFollowList) {
      if (whoIFollowUser.login == notFollowingMeLogin) {
        list.push(whoIFollowUser);
        break;
      }
    }
  }

  return list;
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('check').addEventListener('click', async function () {
    const user = getUser();
    const key = getKey();

    if (!user || !key) {
      return;
    }

    let spinner = document.getElementById('loading-spinner');

    if (spinner) {
      spinner.style.display = 'block';

      const headers = getHeadersWithAuth(user, key);
      const followers = await listFollowersFrom(headers);
      const following = await listFollowingFrom(headers);

      const filteredFollwing = (window.following =
        filterOnlyUsefulInfo(following));
      const filteredFollowers = (window.followers =
        filterOnlyUsefulInfo(followers));

      const notFollowingMeArr = (window.notFollowingMe = compare(
        filteredFollwing,
        filteredFollowers
      ));
      const listObjOfNotFollowingMe = (window.listObjOfNotFollowingMe =
        rebuildObjOfNotFollowingMe(filteredFollwing, notFollowingMeArr));

      spinner.style.display = 'none';

      let doNotFollowMeListContainer =
        document.getElementById('doNotFollowMeList');
      doNotFollowMeListContainer.innerHTML = ''; // Clear the container before appending new data

      listObjOfNotFollowingMe.forEach((notFollowingMeObj) => {
        doNotFollowMeListContainer.innerHTML += `
          <div class="col-xs-1 col-sm-2">
            <a href="${notFollowingMeObj.html_url}">
              <img class="img-thumbnail" src="${notFollowingMeObj.avatar_url}" alt="${notFollowingMeObj.login} (GitHub User)">
              <h4>${notFollowingMeObj.login}</h4>
            </a>
          </div>
        `;
      });

      console.log(listObjOfNotFollowingMe);
    }
  });
});
