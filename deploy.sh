#!/bin/bash
## config
export rootdir=/Users/skpark/work/mnt/atx-ec2/home/ubuntu/atx-spa-dist
export today="$(date '+%Y%m%d')"
export output_dir=dist
export output_backup_dir="atx-spa-dist-${today}"


export dest="${rootdir}/${output_dir}"
export backup_dest="${rootdir}/${output_backup_dir}"
echo $dest 
echo $backup_dest
rm -rf ./dist
yarn build
export return_code=$?
if [ $return_code == 0 ]
then
    echo "App built successfully"
    cp -r dist/* $dest/
    echo "App deployed"
fi