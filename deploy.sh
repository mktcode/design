#!/bin/bash
rsync -avz -e 'ssh -i ~/.ssh/uberspace-mktcode' dist/ mktcode@alnilam.uberspace.de:/var/www/virtual/mktcode/html/wp-content/themes/design