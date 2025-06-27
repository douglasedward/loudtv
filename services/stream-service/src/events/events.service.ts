import { Injectable } from "@nestjs/common";
import { KafkaService } from "@loudtv/kafka";

interface StartStreamData {
  bitrate?: number;
  resolution?: string;
  fps?: number;
  codec?: string;
  startedAt?: Date;
}

interface EndStreamData {
  duration: number; // in seconds
  endedAt: Date;
}

@Injectable()
export class EventsService {
  constructor(private readonly kafkaService: KafkaService) {}

  async publishStreamStarted(
    streamId: string,
    username: string,
    streamData: StartStreamData,
  ) {
    await this.kafkaService.publishStreamStarted(
      streamId,
      username,
      streamData,
    );
  }

  async publishStreamEnded(
    streamId: string,
    username: string,
    endData: EndStreamData,
  ) {
    await this.kafkaService.publishStreamEnded(streamId, username, endData);
  }
}
