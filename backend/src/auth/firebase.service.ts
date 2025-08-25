import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    const privateKey = this.configService
      .get('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    const firebaseConfig = {
      type: 'service_account',
      project_id: this.configService.get('FIREBASE_PROJECT_ID'),
      private_key_id: this.configService.get('FIREBASE_PRIVATE_KEY_ID'),
      private_key: privateKey,
      client_email: this.configService.get('FIREBASE_CLIENT_EMAIL'),
      client_id: this.configService.get('FIREBASE_CLIENT_ID'),
      auth_uri: this.configService.get('FIREBASE_AUTH_URI'),
      token_uri: this.configService.get('FIREBASE_TOKEN_URI'),
    };

    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(
          firebaseConfig as admin.ServiceAccount,
        ),
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      throw new UnauthorizedException('User not found in Firebase');
    }
  }
}
