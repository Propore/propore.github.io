/*
 * Local search — title-only matching with tag display
 * Uses hexo-generator-search (search.xml)
 */
var searchFunc = function(path, searchId, contentId) {

  var dataCache = null;

  function loadData(cb) {
    if (dataCache) { cb(dataCache); return; }
    $.ajax({
      url: path,
      dataType: 'xml',
      success: function(xml) {
        dataCache = $('entry', xml).map(function() {
          var tags = [];
          $('tag', this).each(function() { tags.push($(this).text()); });
          return {
            title: $('title', this).text() || '无标题',
            url:   $('link', this).attr('href'),
            tags:  tags
          };
        }).get();
        cb(dataCache);
      },
      error: function() {
        console.warn('search.xml 加载失败');
      }
    });
  }

  function highlight(text, kw) {
    if (!kw) return text;
    var escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), function(m) {
      return '<em class="search-keyword">' + m + '</em>';
    });
  }

  function renderResults(results, keyword) {
    var stats = document.getElementById('search-stats');
    var noResult = document.getElementById('search-no-result');
    var resultArea = document.getElementById(contentId);

    if (!results.length) {
      resultArea.innerHTML = '';
      if (noResult) noResult.style.display = 'block';
      if (stats) stats.textContent = '';
      return;
    }

    if (noResult) noResult.style.display = 'none';
    if (stats) stats.textContent = '找到 ' + results.length + ' 篇文章';

    var html = '<ul class="search-result-list">';
    results.forEach(function(item) {
      var titleHtml = highlight(item.title, keyword);
      var tagsHtml = item.tags.length
        ? item.tags.map(function(t) {
            return '<span class="search-tag">' + t + '</span>';
          }).join('')
        : '';
      html += '<li class="search-result-item">'
            + '<div class="search-result-main">'
            + '<a href="' + item.url + '" class="search-result-title">' + titleHtml + '</a>'
            + (tagsHtml ? '<div class="search-result-tags">' + tagsHtml + '</div>' : '')
            + '</div>'
            + '</li>';
    });
    html += '</ul>';
    resultArea.innerHTML = html;
  }

  var $input = document.getElementById(searchId);
  if (!$input) return;

  var debounceTimer = null;

  // Preload data on focus
  $input.addEventListener('focus', function() {
    loadData(function() {});
  });

  $input.addEventListener('input', function() {
    var kw = this.value.trim();
    var clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.style.display = kw ? 'flex' : 'none';

    clearTimeout(debounceTimer);

    if (!kw) {
      document.getElementById(contentId).innerHTML = '';
      var noResult = document.getElementById('search-no-result');
      if (noResult) noResult.style.display = 'none';
      var stats = document.getElementById('search-stats');
      if (stats) stats.textContent = '';
      return;
    }

    debounceTimer = setTimeout(function() {
      loadData(function(data) {
        var kwLower = kw.toLowerCase();
        var results = data.filter(function(item) {
          return item.title.toLowerCase().indexOf(kwLower) >= 0;
        });
        renderResults(results, kw);
      });
    }, 200);
  });

  $input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') e.preventDefault();
  });

  var clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      $input.value = '';
      $input.dispatchEvent(new Event('input'));
      $input.focus();
    });
  }
};
