self.addEventListener('install', function(event)
{
    console.log("Service worker installed!");
    event.waitUntil
    (
        caches.open('static')
            .then(function(cache)
            {
                cache.addAll
                (
                    [
                        '/'
                    ]
                )
            })
    );
})

self.addEventListener('activate', function()
{
    console.log("Service worker activated!");
})

//Fetch files either from cache or from the server itself
self.addEventListener('fetch', function(event)
{
    event.respondWith
    (
        caches.match(event.request)
            .then(function(res)
            {
                //If the request exists in the cache get the page if not do a request
                if(res)
                {
                    return res;
                }
                else
                {
                    return fetch(event.request);
                }
            })
    );
})