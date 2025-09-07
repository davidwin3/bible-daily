import { IsArray, IsString, IsOptional, IsBoolean, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OfflineAction {
  @IsString()
  id: string; // 클라이언트에서 생성한 고유 ID

  @IsString()
  type: 'CREATE_POST' | 'TOGGLE_LIKE' | 'COMPLETE_MISSION' | 'UPDATE_POST' | 'DELETE_POST';

  @IsOptional()
  data?: any; // 액션별 데이터

  @IsOptional()
  @IsDateString()
  timestamp?: string; // 액션이 수행된 시간
}

export class SyncDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflineAction)
  actions: OfflineAction[];

  @IsOptional()
  @IsDateString()
  lastSyncAt?: string; // 마지막 동기화 시간

  @IsOptional()
  @IsString()
  deviceId?: string; // 기기 식별자
}

// 개별 액션별 데이터 타입 정의
export interface CreatePostData {
  title: string;
  content: string;
  bibleVerse?: string;
  clientId?: string; // 중복 방지용 클라이언트 ID
  createdAt?: string;
}

export interface ToggleLikeData {
  postId: number;
  isLiked: boolean;
}

export interface CompleteMissionData {
  missionId: number;
  isCompleted: boolean;
}

export interface UpdatePostData {
  postId: number;
  title?: string;
  content?: string;
  bibleVerse?: string;
}

export interface DeletePostData {
  postId: number;
}
