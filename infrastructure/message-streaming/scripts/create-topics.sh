#!/bin/bash

# Create Topics Script for Kafka
# This script creates all necessary topics for the platform

set -e

KAFKA_BROKER="kafka:29092"

echo "🚀 Starting topic creation for Livestreaming Platform..."

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
while ! kafka-topics --bootstrap-server $KAFKA_BROKER --list > /dev/null 2>&1; do
  echo "Waiting for Kafka..."
  sleep 5
done

echo "✅ Kafka is ready!"

create_topic() {
  local topic_name=$1
  local partitions=${2:-3}
  local replication_factor=${3:-1}
  local retention_ms=${4:-604800000}  # 7 days default
  
  echo "📝 Creating topic: $topic_name"
  
  if kafka-topics --bootstrap-server $KAFKA_BROKER --list | grep -q "^${topic_name}$"; then
    echo "⚠️  Topic $topic_name already exists, skipping..."
  else
    kafka-topics --create \
      --bootstrap-server $KAFKA_BROKER \
      --topic $topic_name \
      --partitions $partitions \
      --replication-factor $replication_factor \
      --config retention.ms=$retention_ms \
      --config compression.type=gzip \
      --config segment.ms=86400000 \
      --config cleanup.policy=delete
    
    echo "✅ Topic $topic_name created successfully"
  fi
}

echo ""
echo "🎯 Creating Core Event Topics..."

# Core Events - High Retention (7 days)
create_topic "user.events" 3 1 604800000
create_topic "channel.events" 3 1 604800000  
create_topic "stream.events" 6 1 604800000    # More partitions for high volume
create_topic "chat.events" 6 1 259200000      # 3 days retention for chat

echo ""
echo "💼 Creating Business Event Topics..."

# Business Events
create_topic "payment.events" 3 1 2592000000   # 30 days for payments
create_topic "analytics.events" 3 1 604800000
create_topic "notification.events" 3 1 259200000  # 3 days
create_topic "moderation.events" 3 1 604800000

echo ""
echo "🔧 Creating System Event Topics..."

# System Events  
create_topic "system.events" 3 1 86400000      # 1 day for system events
create_topic "health.events" 3 1 86400000      # 1 day for health checks
create_topic "audit.events" 3 1 2592000000     # 30 days for audit

echo ""
echo "🎮 Creating Feature-Specific Topics..."

# Feature-specific topics
create_topic "viewer.events" 3 1 259200000     # 3 days
create_topic "donation.events" 3 1 2592000000  # 30 days for donations
create_topic "subscription.events" 3 1 2592000000  # 30 days
create_topic "follow.events" 3 1 604800000
create_topic "recommendation.events" 3 1 259200000  # 3 days

echo ""
echo "⚡ Creating Real-time Topics..."

# Real-time/High-frequency topics with shorter retention
create_topic "viewer-count.events" 6 1 86400000    # 1 day, more partitions
create_topic "stream-quality.events" 3 1 86400000  # 1 day
create_topic "chat-moderation.events" 3 1 259200000  # 3 days

echo ""
echo "📊 Listing all created topics..."
kafka-topics --bootstrap-server $KAFKA_BROKER --list | sort

echo ""
echo "📈 Topic details:"
for topic in $(kafka-topics --bootstrap-server $KAFKA_BROKER --list); do
  echo "📍 Topic: $topic"
  kafka-topics --bootstrap-server $KAFKA_BROKER --describe --topic $topic | grep -E "(PartitionCount|ReplicationFactor)" || true
  echo ""
done

echo "🎉 All topics created successfully!"
echo ""
echo "🔗 Kafka UI: http://localhost:8080"
