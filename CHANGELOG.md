### 0.1.2 (2014-12-08)


#### Bug Fixes

* **logging:** initialize nextLog variable ([026d215d](https://github.com/bloglovin/node-rabbit-wrapper/commit/026d215d653c622fa67e99066300c9997ac415f8))


### 0.1.1 (2014-12-04)


#### Bug Fixes

* **main:**
  * random backoff should not be close to 0 ([d5265b6a](https://github.com/bloglovin/node-rabbit-wrapper/commit/d5265b6adb8dff222b14f400e4a1c643478b9283))
  * backoff was broken because of NaN tries ([d0ed01b9](https://github.com/bloglovin/node-rabbit-wrapper/commit/d0ed01b9ed7e57d5fe7f56938249dd73a922e930))


## 0.1.0 (2014-10-28)


#### Features

* **amqplib:** update amqplib dependency ([4968612e](https://github.com/bloglovin/node-rabbit-wrapper/commit/4968612e6ae918850f43e7aa32b2458512f6ae6c))
* **backoff:** make backoff configurable and add logging ([762c4b18](https://github.com/bloglovin/node-rabbit-wrapper/commit/762c4b18d8c1bfb370e0afdc73b2735c61118a5b))
