# strong-metrics

This is a spike implementation of a gateway component providing metrics
gathering and aggregation.

## Discussion points

 - How to configure which request fields should be tracked?

 - How to integrate the metrics middleware with loopback-policy
   and track values computed by policies?

 - Implement time-based buckets for `MetricEvent.aggregate`,
   for example number of events per minute, per hour or per day.
