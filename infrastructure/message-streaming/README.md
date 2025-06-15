# Message Streaming Platform - Live Streaming Platform

Infraestrutura centralizada de mensageria para comunicação assíncrona entre microserviços da plataforma de live streaming.

## 🎯 Responsabilidades

- **Event Streaming**: Apache Kafka para eventos em tempo real
- **Topic Management**: Gerenciamento centralizado de tópicos
- **Message Routing**: Roteamento inteligente de mensagens
- **Monitoring**: Kafka UI para monitoramento visual
- **Schema Registry**: Versionamento de schemas de eventos
- **Performance**: Configurações otimizadas para baixa latência

## 🏗️ Arquitetura

```
Producer Services → Kafka Brokers → Consumer Services
                      ↓
              [Kafka UI] [Schema Registry]
                      ↓
               [Monitoring & Alerts]
```

## 🚀 Tecnologias

- **Kafka**: Apache Kafka 7.4.4 (Confluent Platform)
- **Zookeeper**: Coordenação de cluster
- **Kafka UI**: Interface visual para monitoramento
- **Schema Registry**: Confluent Schema Registry
- **Monitoring**: Prometheus metrics + Grafana dashboards

## 📋 Topics Principais

### Core Events

- `user.events` - Eventos de usuário (criação, atualização, autenticação)
- `channel.events` - Eventos de canal (criação, atualização, configurações)
- `stream.events` - Eventos de streaming (início, fim, metadados)
- `chat.events` - Eventos de chat (mensagens, moderação)

### Business Events

- `payment.events` - Eventos de pagamento (donations, subscriptions)
- `analytics.events` - Eventos de analytics (views, engagement)
- `notification.events` - Eventos de notificação (push, email, in-app)
- `moderation.events` - Eventos de moderação (reports, ações)

### System Events

- `system.events` - Eventos de sistema (health, alerts, monitoring)

## 🛠️ Configuração

### Desenvolvimento Local

```bash
# Iniciar infraestrutura completa
docker-compose up -d

# Verificar health dos serviços
docker-compose ps

# Visualizar logs
docker-compose logs -f kafka

# Acessar Kafka UI
http://localhost:8080
```

### Tópicos

Os tópicos são criados automaticamente quando necessário, mas podem ser pré-criados:

```bash
# Listar tópicos
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Criar tópico manualmente
docker exec kafka kafka-topics --create --topic test-topic --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092

# Deletar tópico
docker exec kafka kafka-topics --delete --topic test-topic --bootstrap-server localhost:9092
```

### Monitoramento

- **Kafka UI**: http://localhost:8080
- **Metrics**: Prometheus metrics expostos em http://localhost:9308/metrics
- **Health Check**: GET /health endpoint

## 📊 Schemas de Eventos

### User Events

```json
{
  "eventId": "uuid",
  "eventType": "user.created|user.updated|user.deleted|user.authenticated",
  "source": "user-service",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0",
  "data": {
    "userId": "uuid",
    "username": "string",
    "email": "string",
    "userType": "viewer|streamer|moderator|admin"
  },
  "metadata": {
    "correlationId": "uuid",
    "sessionId": "uuid"
  }
}
```

### Stream Events

```json
{
  "eventId": "uuid",
  "eventType": "stream.started|stream.ended|stream.updated",
  "source": "channel-service",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0",
  "data": {
    "streamId": "uuid",
    "channelId": "uuid",
    "streamerId": "uuid",
    "title": "string",
    "category": "string",
    "quality": "1080p|720p|480p",
    "viewerCount": 0
  }
}
```

### Chat Events

```json
{
  "eventId": "uuid",
  "eventType": "chat.message_sent|chat.message_deleted|chat.user_timeout",
  "source": "chat-service",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0",
  "data": {
    "messageId": "uuid",
    "channelId": "uuid",
    "userId": "uuid",
    "content": "string",
    "action": "message_sent|message_deleted|user_timeout|user_banned"
  }
}
```

## 🔧 Performance

### Configurações Otimizadas

- **Partitions**: 3 partições por tópico para balanceamento
- **Replication Factor**: 1 (desenvolvimento local)
- **Retention**: 7 dias para eventos, 1 dia para logs
- **Compression**: GZIP para reduzir network I/O
- **Batch Size**: Otimizado para latência vs throughput

### Métricas Importantes

- **Throughput**: Messages/second por tópico
- **Latency**: End-to-end message latency
- **Consumer Lag**: Atraso dos consumers
- **Disk Usage**: Utilização de storage
- **Network I/O**: Tráfego de rede

## 🔒 Segurança

### Desenvolvimento

- **Authentication**: Desabilitado para desenvolvimento local
- **Authorization**: ACLs básicas por service
- **Encryption**: Plaintext (local only)

### Produção (Futuro)

- **SASL/SCRAM**: Autenticação por usuário
- **SSL/TLS**: Criptografia em trânsito
- **ACLs**: Controle de acesso granular

## 🧪 Testes

```bash
# Teste de produção de mensagem
docker exec kafka kafka-console-producer --topic test-topic --bootstrap-server localhost:9092

# Teste de consumo de mensagem
docker exec kafka kafka-console-consumer --topic test-topic --from-beginning --bootstrap-server localhost:9092

# Teste de performance
docker exec kafka kafka-producer-perf-test --topic test-topic --num-records 10000 --record-size 1024 --throughput 1000 --producer-props bootstrap.servers=localhost:9092
```

## 🚀 Integração com Microserviços

### Producer (Publicar Eventos)

```typescript
// Em qualquer microserviço
import { KafkaService } from "./kafka.service";

// Publicar evento de usuário criado
await kafkaService.publish("user.events", {
  eventId: uuid(),
  eventType: "user.created",
  source: "user-service",
  timestamp: new Date(),
  data: userData,
});
```

### Consumer (Consumir Eventos)

```typescript
// Subscrever em eventos de interesse
await kafkaService.subscribe(["stream.events", "chat.events"], (message) => {
  // Processar evento recebido
  console.log("Event received:", message);
});
```

## 📝 Logs

Logs estruturados em JSON:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "service": "message-streaming",
  "message": "Message published successfully",
  "topic": "user.events",
  "partition": 0,
  "offset": 12345,
  "correlationId": "uuid"
}
```

## 🆘 Troubleshooting

### Problemas Comuns

1. **Kafka não conecta**

   ```bash
   # Verificar se Zookeeper está rodando
   docker exec zookeeper zkServer.sh status

   # Verificar logs do Kafka
   docker logs kafka
   ```

2. **Consumer lag alto**

   ```bash
   # Verificar consumer groups
   docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list

   # Detalhar lag específico
   docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --group my-group --describe
   ```

3. **Tópico não existe**
   ```bash
   # Criar tópico manualmente
   docker exec kafka kafka-topics --create --topic missing-topic --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
   ```

## 🤝 Contributing

1. Siga os schemas de eventos definidos
2. Use correlation IDs para rastreamento
3. Implemente retry logic nos consumers
4. Monitore métricas de performance
5. Teste localmente antes de committar

## 📄 License

Este projeto está licenciado sob a MIT License.
